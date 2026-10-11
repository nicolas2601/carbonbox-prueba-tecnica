import type { JobClaim } from "../ports/JobClaim";

export interface ProcessFileCommand { claim: JobClaim; }
