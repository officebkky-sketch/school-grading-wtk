import { StudentScoreRecord } from '../types/pp5Types';

const emptySubjects = {
  "sub_tha": {},
  "sub_mat": {},
  "sub_sci": {},
  "sub_soc": {},
  "sub_his": {},
  "sub_hpe": {},
  "sub_art": {},
  "sub_occ": {},
  "sub_eng": {}
};

export const INITIAL_SCORES: Record<string, Record<string, Record<string, StudentScoreRecord>>> = {
  "อ.2": {},
  "อ.3": {},
  "ป.1": { ...emptySubjects },
  "ป.2": { ...emptySubjects },
  "ป.3": { ...emptySubjects },
  "ป.4": { ...emptySubjects },
  "ป.5": { ...emptySubjects },
  "ป.6": { ...emptySubjects }
};
