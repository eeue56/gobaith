import { FieldRename } from "./rename_fields";

export const renameStateFields: FieldRename = {
  path: [
    { kind: "Array", field: "journalEntries" },
    { kind: "Property", field: "promptResponses" },
  ],
  before: "Today's feelings of elevatation",
  after: "Today's feelings of elevation",
};
