const express=require('express');
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.get("/test", (req, res) => {
  const token = req.query.token;
  console.log(token)

  res.setHeader("Authorization", token);

  res.send("Check the response headers");
});

app.listen(3000, () => {
  console.log("Vulnerable server running on http://localhost:3000");
});
// Universally accepted way to sent urls
// Some system trusts headers thats why its not good and base64url saves us from this
// if (req.headers["x-admin"] === "true") {
//   allowAdminAccess();
// }

// or

// if ($http_x_internal = "true") {
//   allow;
// }

// So when an attacker injects:

// X-Admin: true