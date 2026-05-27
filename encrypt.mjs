import https from "https";

const ENTITY_SECRET = "22fc7d1a35c29e709389c4dfa705c57bbcac3cdc3b2ad34f9b1b1c1a09062688";
const API_KEY = "TEST_API_KEY:9787873e870a0441b467170ddf943e19:95df5aefca6140e23c6679a8e0d8a7e1";

// Get public key from Circle
const options = {
  hostname: "api.circle.com",
  path: "/v1/w3s/config/entity/publicKey",
  method: "GET",
  headers: { "Authorization": `Bearer ${API_KEY}` }
};

https.get(options, (res) => {
  let data = "";
  res.on("data", chunk => data += chunk);
  res.on("end", () => {
    const { data: { publicKey } } = JSON.parse(data);
    
    import("node:crypto").then(({ publicEncrypt, createPublicKey, constants }) => {
      const key = createPublicKey({
        key: Buffer.from(
          publicKey.replace("-----BEGIN PUBLIC KEY-----", "")
                   .replace("-----END PUBLIC KEY-----", "")
                   .replace(/\s/g, ""),
          "base64"
        ),
        format: "der",
        type: "spki"
      });

      const encrypted = publicEncrypt(
        { key, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" },
        Buffer.from(ENTITY_SECRET, "hex")
      );

      console.log("\nCIPHERTEXT (paste this into Circle Console):");
      console.log(encrypted.toString("base64"));
    });
  });
});
