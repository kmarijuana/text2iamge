import express, { Application, Request, Response } from "express";
const app: Application = express();
const PORT = process.env.PORT || 3333;

import * as Generation from "./api-interfaces-main/gooseai/generation/generation_pb";
import { GenerationServiceClient } from "./api-interfaces-main/gooseai/generation/generation_pb_service";
import { grpc as GRPCWeb } from "@improbable-eng/grpc-web";
import { NodeHttpTransport } from "@improbable-eng/grpc-web-node-http-transport";

// This is a NodeJS-specific requirement - browsers implementations should omit this line.
GRPCWeb.setDefaultTransport(NodeHttpTransport());

// Authenticate using your API key, don't commit your key to a public repository!
const metadata = new GRPCWeb.Metadata();
metadata.set(
  "Authorization",
  "Bearer " + "sk-xybhzt1rziAg12gCBEXBuBVWt4XodRMVv1wxUe37iOAwh3Tx"
);

// Create a generation client to use with all future requests
const client = new GenerationServiceClient("https://grpc.stability.ai", {});

import fs from "fs";
// import * as Generation from "./generation/generation_pb";
import {
  buildGenerationRequest,
  executeGenerationRequest,
  onGenerationComplete,
} from "./helpers";

function generateImage(req: Request) {
  const request = buildGenerationRequest("stable-diffusion-512-v2-1", {
    type: "text-to-image",
    prompts: [
      {
        // text: "A dream of a distant galaxy, by Caspar David Friedrich, matte painting trending on artstation HQ",
        text: req.params.text,
      },
    ],
    width: 512,
    height: 512,
    samples: 1,
    cfgScale: 13,
    steps: 25,
    sampler: Generation.DiffusionSampler.SAMPLER_K_DPMPP_2M,
  });

  return executeGenerationRequest(client, request, metadata)
    .then(onGenerationComplete)
    .catch((error) => {
      console.error("Failed to make text-to-image request:", error);
    });
}

app.get("/test/:text", async (req: Request, res: Response) => {
  //   res.send("Hello World!");

  let image = await generateImage(req);
  await console.log(image ? image[0] : null);
  if (image) {
    await fs.readFile(image[0], function (err, data) {
      if (err) throw err; // Fail if the file can't be read.
      // http.createServer(function(req, res) {
      res.writeHead(200, { "Content-Type": "image/jpeg" });
      res.end(data); // Send the file data to the browser.
      // }).listen(8124)
      console.log("Server running at http://localhost:8124/");
    });
  }
});

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
