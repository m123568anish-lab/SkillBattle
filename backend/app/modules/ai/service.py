class AIService:
    def __init__(self):
        self.client = None
        self.model = "gemini-1.5-flash"

    def generate_response(self, prompt: str) -> str:
        return f"AI response to: {prompt}"

    def generate_json(self, prompt: str):
        try:
            response = self.client.models.generate_content(model=self.model, contents=prompt)
            return response.text
        except Exception as exc:
            raise RuntimeError(f"Gemini request failed: {exc}") from exc


ai_service = AIService()