from pydantic import BaseModel


class DashboardResponse(BaseModel):

    api_keys: int

    total_requests: int

    active_projects: int

    sdk_downloads: int