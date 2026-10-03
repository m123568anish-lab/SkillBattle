export interface CollegeRegistrationRequest {
  name: string;
  code: string;
  domain?: string;
  city?: string;
  state?: string;
  admin_name: string;
  admin_email: string;
  admin_password: string;
}

export interface CompanyRegistrationRequest {
  name: string;
  slug: string;
  industry?: string;
  website?: string;
  headquarters?: string;
  description?: string;
}