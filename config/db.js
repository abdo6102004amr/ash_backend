import mysql from "mysql2/promise";

const db = await mysql.createConnection(process.env.DB_URL);

console.log("DB Connected ✅");

export default db;
