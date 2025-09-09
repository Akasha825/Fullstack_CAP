using {cuid} from '@sap/cds/common';

context ai.db {
  entity Science_Data : cuid {
    key ID : UUID;
    Topic           : String;
    DifficultyLevel : String(100);
    Category        : String(100);
    Embedding       : LargeString;
  }
}