export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            job_listings: {
                Row: {
                    id: string
                    user_id: string
                    company_name: string
                    role_title: string
                    job_description: string
                    job_link: string
                    hiring_manager: string | null
                    is_actioned: boolean
                    resume_url: string | null
                    cover_letter_url: string | null
                    drive_folder_url: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    company_name: string
                    role_title: string
                    job_description: string
                    job_link: string
                    hiring_manager?: string | null
                    is_actioned?: boolean
                    resume_url?: string | null
                    cover_letter_url?: string | null
                    drive_folder_url?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    company_name?: string
                    role_title?: string
                    job_description?: string
                    job_link?: string
                    hiring_manager?: string | null
                    is_actioned?: boolean
                    resume_url?: string | null
                    cover_letter_url?: string | null
                    drive_folder_url?: string | null
                    created_at?: string
                }
            }
        }
    }
}
