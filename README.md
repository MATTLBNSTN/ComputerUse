# ComputerUse
The system consists of 3 parts: 
Ingestion and persistence - Uses google computer use api to traverse linkedin or other job sites finding matching jobs to the string defined in settings files, collect them and store them in a DB table 
Generation and storage - Takes the data written by the ingest process and passes it to Google Gemini 3 with a knowledge file and a detailed prompt, resultant documents are stored on google drive 
Review and action (UI)- All founds jobs, generated CVs and cover letters can be reviewed and marked as actioned 

