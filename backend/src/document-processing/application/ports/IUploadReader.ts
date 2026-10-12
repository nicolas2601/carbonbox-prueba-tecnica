import type { Upload } from "../../domain/entities/Upload";

export interface IUploadReader { findById(id: string): Promise<Upload | null>; }
