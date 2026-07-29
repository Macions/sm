import bcrypt from "bcrypt";

const password = "prezes";

bcrypt.hash(password, 10).then((hash) => {
	console.log(hash);
});
