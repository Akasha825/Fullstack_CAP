using { ai.db as db } from '../db/schema';

@requires: 'any'
service RagService {

  /** Main Science Data Entity (projection on DB table) */
  entity ScienceData as projection on db.Science_Data excluding {
    Embedding   // exclude vector column (not supported in SQLite UI)
  };

  /** CSV Upload Entity (used in rag-service.ts PUT handler) */
  @cds.persistence.skip
  @odata.singleton
  entity ScienceDataUpload {
    @Core.MediaType  : mediaType
    content   : LargeBinary;

    @Core.IsMediaType: true
    mediaType : String;
  };

  /** Value Lists for dropdowns / filters */
  @readonly
  entity categoryList as select from db.Science_Data distinct {
    key Category
  };

  @readonly
  entity difficultyLevelList as select from db.Science_Data distinct {
    key DifficultyLevel
  };
}
