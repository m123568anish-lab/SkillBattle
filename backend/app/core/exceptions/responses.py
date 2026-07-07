from fastapi.responses import JSONResponse


def api_error(message: str, status_code: int):

    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "error": {
                "message": message,
                "code": status_code,
            },
        },
    )