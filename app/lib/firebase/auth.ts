import { getAuth } from "firebase/auth";
import { app } from "./config";

export const auth = getAuth(app);

export const TEST_ADMIN_UID = "RwHDYu1wkPVrRUJ13kiMMFrB9E72"; 