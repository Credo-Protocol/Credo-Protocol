// Credo Protocol API endpoint

export default function handler(req, res) {
  res.status(200).json({ 
    name: "Credo Protocol API",
    version: "0.1.0",
    description: "Decentralized Trust for Capital"
  });
}
