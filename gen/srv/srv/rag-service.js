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
                let scienceDataChunks = [];
                scienceDataRows.forEach((row) => {
                    // Normalize CSV headers to match entity fields
                    const newRow = {
                        Category: row.Category?.trim(),
                        DifficultyLevel: row["Difficulty Level"]?.trim() || row.DifficultyLevel?.trim(),
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
                    }
                    else {
                        // If no Topic field, still insert the row
                        scienceDataChunks.push({ ...newRow, ID: uuid() });
                    }
                });
                // ✅ Insert into DB (projection → ScienceData → ai.db.Science_Data)
                await INSERT.into(ScienceData).entries(scienceDataChunks);
                logger.info(`CSV Upload: ${scienceDataChunks.length} rows inserted into ScienceData`);
                return { message: `${scienceDataChunks.length} rows inserted` };
            }
            else {
                return req.error(400, "Invalid file type or missing content");
            }
        }
        catch (ex) {
            logger.error(`Error while uploading file: ${ex.message}`);
            return req.error(400, `Error while uploading file: ${ex.message}`);
        }
    }
}
module.exports = RagService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmFnLXNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcnYvcmFnLXNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxHQUFHLE1BQU0sVUFBVSxDQUFDO0FBQzNCLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQztBQUNoRCxNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQztBQUMzQixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBRTlCLE1BQU0sU0FBUyxHQUFHLEdBQUcsQ0FBQztBQUV0QixNQUFNLFVBQVcsU0FBUSxHQUFHLENBQUMsa0JBQWtCO0lBQzdDLEtBQUssQ0FBQyxJQUFJO1FBQ1IsTUFBTSxFQUFFLGlCQUFpQixFQUFFLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUUxRCwwQkFBMEI7UUFDMUIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUM7UUFFNUQsTUFBTSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDckIsQ0FBQztJQUVEOzs7T0FHRztJQUNILEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHO1FBQzNCLElBQUksQ0FBQztZQUNILE1BQU0sRUFBRSxXQUFXLEVBQUUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBRXRDLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLEtBQUssVUFBVSxFQUFFLENBQUM7Z0JBQzFELDRCQUE0QjtnQkFDNUIsSUFBSSxlQUFlLEdBQUcsTUFBTSxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFFeEQsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDNUIsT0FBTyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSwwQ0FBMEMsQ0FBQyxDQUFDO2dCQUNwRSxDQUFDO2dCQUVELElBQUksaUJBQWlCLEdBQVUsRUFBRSxDQUFDO2dCQUVsQyxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7b0JBQzlCLCtDQUErQztvQkFDL0MsTUFBTSxNQUFNLEdBQUc7d0JBQ2IsUUFBUSxFQUFFLEdBQUcsQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFO3dCQUM5QixlQUFlLEVBQ2IsR0FBRyxDQUFDLGtCQUFrQixDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksR0FBRyxDQUFDLGVBQWUsRUFBRSxJQUFJLEVBQUU7d0JBQ2hFLEtBQUssRUFBRSxHQUFHLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRTtxQkFDekIsQ0FBQztvQkFFRiw0QkFBNEI7b0JBQzVCLElBQUksTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO3dCQUNqQixJQUFJLEtBQUssR0FBRyxDQUFDLENBQUM7d0JBQ2QsT0FBTyxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQzs0QkFDbkMsaUJBQWlCLENBQUMsSUFBSSxDQUFDO2dDQUNyQixHQUFHLE1BQU07Z0NBQ1QsRUFBRSxFQUFFLElBQUksRUFBRTtnQ0FDVixLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEtBQUssR0FBRyxTQUFTLENBQUM7NkJBQ3BELENBQUMsQ0FBQzs0QkFDSCxLQUFLLElBQUksU0FBUyxDQUFDO3dCQUNyQixDQUFDO29CQUNILENBQUM7eUJBQU0sQ0FBQzt3QkFDTiwwQ0FBMEM7d0JBQzFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsTUFBTSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7b0JBQ3BELENBQUM7Z0JBQ0gsQ0FBQyxDQUFDLENBQUM7Z0JBRUgsbUVBQW1FO2dCQUNuRSxNQUFNLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7Z0JBRTFELE1BQU0sQ0FBQyxJQUFJLENBQ1QsZUFBZSxpQkFBaUIsQ0FBQyxNQUFNLGlDQUFpQyxDQUN6RSxDQUFDO2dCQUNGLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxpQkFBaUIsQ0FBQyxNQUFNLGdCQUFnQixFQUFFLENBQUM7WUFDbEUsQ0FBQztpQkFBTSxDQUFDO2dCQUNOLE9BQU8sR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsc0NBQXNDLENBQUMsQ0FBQztZQUNoRSxDQUFDO1FBQ0gsQ0FBQztRQUFDLE9BQU8sRUFBRSxFQUFFLENBQUM7WUFDWixNQUFNLENBQUMsS0FBSyxDQUFDLCtCQUErQixFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUMxRCxPQUFPLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLCtCQUErQixFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUNyRSxDQUFDO0lBQ0gsQ0FBQztDQUNGO0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRyxVQUFVLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY2RzIGZyb20gXCJAc2FwL2Nkc1wiO1xuaW1wb3J0IHsgcGFyc2VGaWxlIH0gZnJvbSBcIi4vdXRpbHMvY3N2LWZpbGUuanNcIjtcbmNvbnN0IHsgdXVpZCB9ID0gY2RzLnV0aWxzO1xuY29uc3QgbG9nZ2VyID0gY2RzLmxvZyhcInJhZ1wiKTtcblxuY29uc3QgY2h1bmtTaXplID0gNTAwO1xuXG5jbGFzcyBSYWdTZXJ2aWNlIGV4dGVuZHMgY2RzLkFwcGxpY2F0aW9uU2VydmljZSB7XG4gIGFzeW5jIGluaXQoKSB7XG4gICAgY29uc3QgeyBTY2llbmNlRGF0YVVwbG9hZCB9ID0gdGhpcy5lbnRpdGllcyhcIlJhZ1NlcnZpY2VcIik7XG5cbiAgICAvLyBSZWdpc3RlciB1cGxvYWQgaGFuZGxlclxuICAgIHRoaXMub24oXCJQVVRcIiwgU2NpZW5jZURhdGFVcGxvYWQsIHRoaXMub25JbXBvcnRTY2llbmNlRGF0YSk7XG5cbiAgICBhd2FpdCBzdXBlci5pbml0KCk7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlciBmb3IgaW1wb3J0aW5nIHNjaWVuY2UgZGF0YSBmcm9tIENTViBmaWxlXG4gICAqIEBwYXJhbSB7aW1wb3J0KCdAc2FwL2Nkcy9hcGlzL3NlcnZpY2VzJykuUmVxdWVzdH0gcmVxXG4gICAqL1xuICBhc3luYyBvbkltcG9ydFNjaWVuY2VEYXRhKHJlcSkge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB7IFNjaWVuY2VEYXRhIH0gPSB0aGlzLmVudGl0aWVzO1xuXG4gICAgICBpZiAocmVxLmRhdGEuY29udGVudCAmJiByZXEuZGF0YS5tZWRpYVR5cGUgPT09IFwidGV4dC9jc3ZcIikge1xuICAgICAgICAvLyBQYXJzZSBDU1YgaW50byBKUyBvYmplY3RzXG4gICAgICAgIGxldCBzY2llbmNlRGF0YVJvd3MgPSBhd2FpdCBwYXJzZUZpbGUocmVxLmRhdGEuY29udGVudCk7XG5cbiAgICAgICAgaWYgKCFzY2llbmNlRGF0YVJvd3MubGVuZ3RoKSB7XG4gICAgICAgICAgcmV0dXJuIHJlcS5lcnJvcig0MDAsIFwiQ1NWIGZpbGUgaXMgZW1wdHkgb3IgY291bGQgbm90IGJlIHBhcnNlZFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBzY2llbmNlRGF0YUNodW5rczogYW55W10gPSBbXTtcblxuICAgICAgICBzY2llbmNlRGF0YVJvd3MuZm9yRWFjaCgocm93KSA9PiB7XG4gICAgICAgICAgLy8gTm9ybWFsaXplIENTViBoZWFkZXJzIHRvIG1hdGNoIGVudGl0eSBmaWVsZHNcbiAgICAgICAgICBjb25zdCBuZXdSb3cgPSB7XG4gICAgICAgICAgICBDYXRlZ29yeTogcm93LkNhdGVnb3J5Py50cmltKCksXG4gICAgICAgICAgICBEaWZmaWN1bHR5TGV2ZWw6XG4gICAgICAgICAgICAgIHJvd1tcIkRpZmZpY3VsdHkgTGV2ZWxcIl0/LnRyaW0oKSB8fCByb3cuRGlmZmljdWx0eUxldmVsPy50cmltKCksXG4gICAgICAgICAgICBUb3BpYzogcm93LlRvcGljPy50cmltKCksXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIC8vIFNwbGl0IFwiVG9waWNcIiBpbnRvIGNodW5rc1xuICAgICAgICAgIGlmIChuZXdSb3cuVG9waWMpIHtcbiAgICAgICAgICAgIGxldCBpbmRleCA9IDA7XG4gICAgICAgICAgICB3aGlsZSAoaW5kZXggPCBuZXdSb3cuVG9waWMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgIHNjaWVuY2VEYXRhQ2h1bmtzLnB1c2goe1xuICAgICAgICAgICAgICAgIC4uLm5ld1JvdyxcbiAgICAgICAgICAgICAgICBJRDogdXVpZCgpLFxuICAgICAgICAgICAgICAgIFRvcGljOiBuZXdSb3cuVG9waWMuc2xpY2UoaW5kZXgsIGluZGV4ICsgY2h1bmtTaXplKSxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIGluZGV4ICs9IGNodW5rU2l6ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gSWYgbm8gVG9waWMgZmllbGQsIHN0aWxsIGluc2VydCB0aGUgcm93XG4gICAgICAgICAgICBzY2llbmNlRGF0YUNodW5rcy5wdXNoKHsgLi4ubmV3Um93LCBJRDogdXVpZCgpIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g4pyFIEluc2VydCBpbnRvIERCIChwcm9qZWN0aW9uIOKGkiBTY2llbmNlRGF0YSDihpIgYWkuZGIuU2NpZW5jZV9EYXRhKVxuICAgICAgICBhd2FpdCBJTlNFUlQuaW50byhTY2llbmNlRGF0YSkuZW50cmllcyhzY2llbmNlRGF0YUNodW5rcyk7XG5cbiAgICAgICAgbG9nZ2VyLmluZm8oXG4gICAgICAgICAgYENTViBVcGxvYWQ6ICR7c2NpZW5jZURhdGFDaHVua3MubGVuZ3RofSByb3dzIGluc2VydGVkIGludG8gU2NpZW5jZURhdGFgXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiB7IG1lc3NhZ2U6IGAke3NjaWVuY2VEYXRhQ2h1bmtzLmxlbmd0aH0gcm93cyBpbnNlcnRlZGAgfTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiByZXEuZXJyb3IoNDAwLCBcIkludmFsaWQgZmlsZSB0eXBlIG9yIG1pc3NpbmcgY29udGVudFwiKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChleCkge1xuICAgICAgbG9nZ2VyLmVycm9yKGBFcnJvciB3aGlsZSB1cGxvYWRpbmcgZmlsZTogJHtleC5tZXNzYWdlfWApO1xuICAgICAgcmV0dXJuIHJlcS5lcnJvcig0MDAsIGBFcnJvciB3aGlsZSB1cGxvYWRpbmcgZmlsZTogJHtleC5tZXNzYWdlfWApO1xuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJhZ1NlcnZpY2U7XG4iXX0=