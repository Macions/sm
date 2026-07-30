import bcrypt from "bcrypt";
import { logger } from "./utils/logger";

const password = "prezes";

bcrypt.hash(password, 10).then((hash) => {
	logger.debug(hash);
});
