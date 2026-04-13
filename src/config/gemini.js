const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY
const requestedModel = import.meta.env.VITE_OPENROUTER_MODEL || "cohere/rerank-4-pro"
const openRouterEndpoint = "https://openrouter.ai/api/v1/chat/completions"

const domainInstruction =
	"You are Abhiyanta GPT, an assistant for engineering students. Focus on civil, mechanical, electrical, electronics, computer, chemical, and production engineering topics. Give clear, step-by-step explanations with formulas and practical examples when needed."

let quotaBlockedUntil = 0

const safeJsonParse = async (response) => {
	try {
		return await response.json()
	} catch {
		return null
	}
}


const normalizeTextContent = (content) => {
	if (typeof content === "string") return content.trim()
	if (!Array.isArray(content)) return ""

	return content
		.map((item) => {
			if (typeof item === "string") return item
			if (item?.type === "text" && typeof item?.text === "string") return item.text
			return ""
		})
		.filter(Boolean)
		.join("\n")
		.trim()
}

const getModelCandidates = () => {
	if (/rerank/i.test(requestedModel)) {
		// Rerank models are not chat models, so keep user's model first and then
		// automatically fallback to an OpenRouter chat-compatible route.
		return [requestedModel, "openrouter/auto"]
	}

	return [requestedModel]
}


const getRetrySeconds = (status, payload, headers, message) => {
	if (status === 429) {
		const retryAfter = headers?.get?.("retry-after")
		if (retryAfter) {
			const parsed = Number(retryAfter)
			if (!Number.isNaN(parsed) && parsed > 0) return Math.ceil(parsed)
		}
	}

	const payloadMessage = payload?.error?.message || message || ""
	if (typeof payloadMessage === "string") {
		const match = payloadMessage.match(/retry\s+(in\s+)?([\d.]+)s/i)
		if (match) return Math.ceil(Number(match[2]))
	}

	return 0
}

const isQuotaError = (status, payload, message) => {
	if (status === 429 || payload?.error?.code === 429) return true
	const text = `${payload?.error?.message || ""} ${message || ""}`
	return /quota|rate limit|resource_exhausted|too many requests|429/i.test(text)
}

const isModelUnsupportedForChat = (status, payload, message) => {
	if (status < 400 || status >= 500) return false
	const text = `${payload?.error?.message || ""} ${message || ""}`
	return /rerank|not.*chat|chat.*not.*supported|unsupported model|completion.*not.*supported/i.test(text)
}

const isProviderRouteError = (status, payload, message) => {
	const text = `${payload?.error?.message || ""} ${message || ""}`

	if (/provider returned error|upstream error|no available providers|temporarily unavailable/i.test(text)) {
		return true
	}

	return status >= 500
}


const toFriendlyError = (status, payload, message, attemptedModels) => {
	if (isQuotaError(status, payload, message)) {
		const retrySeconds = getRetrySeconds(status, payload, null, message)

		if (retrySeconds > 0) {
			quotaBlockedUntil = Date.now() + retrySeconds * 1000
			return new Error(
				`Rate limit reached. Please wait about ${retrySeconds}s and try again. Tried models: ${attemptedModels.join(", ")}.`,
			)
		}

		return new Error(
			`Quota/rate limit reached for this OpenRouter key. Tried models: ${attemptedModels.join(", ")}. Please check your OpenRouter usage and billing.`,
		)
	}

	if (isModelUnsupportedForChat(status, payload, message)) {
		return new Error(
			`Model '${requestedModel}' is not chat-capable (it appears to be a rerank model). Please set VITE_OPENROUTER_MODEL to a chat model like 'openrouter/auto' or 'google/gemini-2.0-flash-001'.`,
		)
	}

	if (isProviderRouteError(status, payload, message)) {
		return new Error(
			`Provider route failed for model '${requestedModel}'. Please retry, or set VITE_OPENROUTER_MODEL to 'openrouter/auto' or another chat model.`,
		)
	}

	return new Error(payload?.error?.message || message || "Failed to fetch response from OpenRouter.")
}

const getCooldownSeconds = () => {
	if (Date.now() >= quotaBlockedUntil) return 0
	return Math.ceil((quotaBlockedUntil - Date.now()) / 1000)
}


const assertKey = () => {
	if (!apiKey) {
		throw new Error("OpenRouter API key is missing. Set VITE_OPENROUTER_API_KEY in your environment.")
	}
}

const requestWithModel = async (model, prompt) => {
	const response = await fetch(openRouterEndpoint, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
			"HTTP-Referer": "http://localhost:5173",
			"X-Title": "Abhiyanta GPT",
		},
		body: JSON.stringify({
			model,
			messages: [
				{ role: "system", content: domainInstruction },
				{ role: "user", content: prompt },
			],
			temperature: 0.45,
			max_tokens: 1024,
		}),
	})

	const payload = await safeJsonParse(response)
	if (!response.ok) {
		const message = payload?.error?.message || `OpenRouter request failed with status ${response.status}.`
		const retrySeconds = getRetrySeconds(response.status, payload, response.headers, message)
		if (retrySeconds > 0) {
			quotaBlockedUntil = Date.now() + retrySeconds * 1000
		}

		const requestError = new Error(message)
		requestError.status = response.status
		requestError.payload = payload
		throw requestError
	}

	const answer = normalizeTextContent(payload?.choices?.[0]?.message?.content)
	if (!answer) {
		throw new Error("OpenRouter returned an empty response. Please try again.")
	}

	return answer
}

export const generateEngineeringResponse = async (prompt) => {
	const sanitizedPrompt = prompt?.trim()
	if (!sanitizedPrompt) {
		throw new Error("Prompt cannot be empty.")
	}

	const cooldown = getCooldownSeconds()
	if (cooldown > 0) {
		throw new Error(`Please wait ${cooldown}s before sending the next prompt.`)
	}

	assertKey()

	const modelCandidates = getModelCandidates()
	const attemptedModels = []
	let lastError

	for (const model of modelCandidates) {
		attemptedModels.push(model)

		try {
			return await requestWithModel(model, sanitizedPrompt)
		} catch (error) {
			lastError = error
			const status = error?.status || 0
			const payload = error?.payload
			const message = error?.message || ""
			const isLastModel = model === modelCandidates[modelCandidates.length - 1]

			if (isModelUnsupportedForChat(status, payload, message) && !isLastModel) {
				continue
			}

			if (isProviderRouteError(status, payload, message) && !isLastModel) {
				continue
			}

			if (isQuotaError(status, payload, message) && !isLastModel) {
				continue
			}

			break
		}
	}

	if (lastError && typeof lastError === "object") {
		throw toFriendlyError(lastError.status || 0, lastError.payload, lastError.message, attemptedModels)
	}

	throw new Error(lastError?.message || "Failed to fetch response from OpenRouter.")
}

