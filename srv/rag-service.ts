import cds from "@sap/cds";
import { parseFile } from "./utils/csv-file.js";
const { uuid } = cds.utils;
const logger = cds.log("rag");

const chunkSize = 500;

class RagService extends cds.ApplicationService {
  async init() {
    const { ScienceDataUpload } = this.entities("RagService");

    // Register upload handler
    this.on("PUT", ScienceDataUpload, this.onImportScienceData);

    await super.init();
  }

  /**
   * Handler for importing science data from CSV file
   * @param {import('@sap/cds/apis/services').Request} req
   */
  async onImportScienceData(req) {
    try {
      const { ScienceData } = this.entities;

      if (req.data.content && req.data.mediaType === "text/csv") {
        // Parse CSV into JS objects
        let scienceDataRows = await parseFile(req.data.content);

        if (!scienceDataRows.length) {
          return req.error(400, "CSV file is empty or could not be parsed");
        }

        let scienceDataChunks: any[] = [];

        scienceDataRows.forEach((row) => {
          // Normalize CSV headers to match entity fields
          const newRow = {
            Category: row.Category?.trim(),
            DifficultyLevel:
              row["Difficulty Level"]?.trim() || row.DifficultyLevel?.trim(),
            Topic: row.Topic?.trim(),
          };

          // Split "Topic" into chunks
          if (newRow.Topic) {
            let index = 0;
            while (index < newRow.Topic.length) {
              scienceDataChunks.push({
                ...newRow,
                ID: uuid(),
                Topic: newRow.Topic.slice(index, index + chunkSize),
              });
              index += chunkSize;
            }
          } else {
            // If no Topic field, still insert the row
            scienceDataChunks.push({ ...newRow, ID: uuid() });
          }
        });

        // ✅ Insert into DB (projection → ScienceData → ai.db.Science_Data)
        await INSERT.into(ScienceData).entries(scienceDataChunks);

        logger.info(
          `CSV Upload: ${scienceDataChunks.length} rows inserted into ScienceData`
        );
        return { message: `${scienceDataChunks.length} rows inserted` };
      } else {
        return req.error(400, "Invalid file type or missing content");
      }
    } catch (ex) {
      logger.error(`Error while uploading file: ${ex.message}`);
      return req.error(400, `Error while uploading file: ${ex.message}`);
    }
  }
}

module.exports = RagService;
