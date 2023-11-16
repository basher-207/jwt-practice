require("dotenv").config({ path: '.env.example' });
const app = require("./app");

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}...`);
});
