const cluster = require("cluster");
const http = require("http");
const fs = require("fs");
const path = require("path");
// const Koa = require("koa");

// const app = new Koa();

exports.nodeNginxApp = function (filename, args) {
  if (cluster.isMaster) {
    const fileObj = path.parse(filename);
    // console.log(fileObj);
    const pidFilename = fileObj.name;
    const pidFolder = path.join(__dirname, `run`);
    const pidFile = path.join(pidFolder, `${pidFilename}.pid`);

    if (args[0] === "reload") {
      if (fs.existsSync(pidFile)) {
        const exitsPid = fs.readFileSync(pidFile, { encoding: "utf-8" });
        console.log({ exitsPid });
        process.kill(exitsPid, "SIGUSR2");
      } else {
        console.log("no pid exits");
      }
      return;
    }

    // console.log({ pidFile })
    fs.mkdirSync(pidFolder);
    fs.writeFileSync(pidFile, process.pid);

    // process.on("beforeExit", (code) => {
    //   console.log("Process beforeExit event with code: ", code);
    // });

    process.on("exit", (code) => {
      fs.unlinkSync(pidFile);
      console.log("Process exit event with code: ", code);
    });

    process.on("SIGINT", function (signal) {
      console.log("Caught interrupt signal", signal);
      process.exit();
    });

    process.on("SIGUSR2", function (signal) {
      console.log(signal);
      for (const id in cluster.workers) {
        // cluster.workers[id].emit('message', {cmd: 'kill'});
        cluster.workers[id].send({ cmd: "shutdown" });
        forkWorker();
      }
    });

    for (let i = 0; i < 2; i++) {
      forkWorker();
    }

    function forkWorker() {
      const worker = cluster.fork();
      // const workerPid = worker.process.pid;

      worker.on("listening", (address) => {
        // console.log("worker listening", address);
      });

      worker.on("disconnect", (msg) => {
        // clearTimeout(timeout);
        console.log("disconnect");
        // forkWorker();
      });
    }
  } else {
    const server = http
      .createServer((req, res) => {
        res.end("hi");
      })
      .listen(8000);
    console.log(`Worker ${process.pid} started`);
    process.on("message", (msg) => {
      const { cmd } = msg;
      switch (cmd) {
        case "shutdown":
          {
            // Initiate graceful close of any connections to server
            setTimeout(() => {
              console.log("process exit", process.pid);
              process.exit(1);
            }, 30000);
            server.close();
          }
          break;
        default:
          console.log({ msg });
          break;
      }
    });
  }
};
