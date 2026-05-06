import mysql from "mysql2/promise";

const db = mysql.createPool({
  uri: process.env.DB_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

console.log("DB Pool Connected ✅");

export default db;
