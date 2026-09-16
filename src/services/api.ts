// Keep legacy imports on the same authenticated client as the dashboard.
// This prevents older features from silently falling back to localhost.
export { api as default } from "@/lib/api";
