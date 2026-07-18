import bcrypt from "bcrypt";

const password = "test123";

bcrypt.hash(password, 10).then((hash) => {
	console.log(hash);
});
