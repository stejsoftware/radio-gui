const SerialPort = require("serialport");
const blessed = require("blessed");
const contrib = require("blessed-contrib");

var port = process.argv.slice(2).shift();

if (port) {
  var port = new SerialPort(port, {
    baudRate: 9600
  });

  var screen = blessed.screen({
    title: "My Radio",
    smartCSR: true,
    style: {
      fg: "white",
      bg: "black"
    },
    cursor: {
      shape: "underline",
      color: "blue"
    }
  });

  var lcd = contrib.lcd({
    top: "top",
    left: 5,
    width: 3 * (5 * 4),
    height: 4 * 4,
    display: "000.0",
    color: "green",
    style: {
      bg: "black",
      border: {
        fg: "#f0f0f0",
        bg: "black"
      }
    },
    border: {
      type: "line"
    },
    elements: 5
    // segmentWidth: 0.1,
    // segmentInterval: 0.1,
    // strokeWidth: 0.1
  });

  var vol = blessed.progressbar({
    top: "top",
    left: 0,
    width: 5,
    value: 0,
    pch: " ",
    orientation: "vertical",
    border: {
      type: "line"
    },
    style: {
      bg: "black",
      bar: {
        bg: "yellow",
        fg: "black"
      },
      border: {
        fg: "#f0f0f0",
        bg: "black"
      }
    }
  });

  var log = blessed.log({
    top: "top",
    right: 0,
    width: 35,
    border: {
      type: "line"
    },
    style: {
      bg: "black",
      border: {
        bg: "black"
      }
    }
  });

  // Open errors will be emitted as an error event
  port.on("error", function(err) {
    log.log("Error: ", err.message);
  });

  const processCommand = (cmd, arg) => {
    log.log({ cmd, arg });

    switch (Number.parseInt(cmd)) {
      case 10:
        var freq = Number.parseInt(arg) / 10;
        lcd.setDisplay(freq);
        log.log({ freq });
        break;

      case 20:
        vol.setProgress(Number.parseInt(arg) / 15 * 100);
        log.log({ vol: vol.value });
        break;

      default:
    }
  };

  var data = "";

  port.on("data", buffer => {
    data += buffer
      .toString()
      .replace(/\n/g, "")
      .replace(/\r/g, "");

    var matches = data.match(/^(.+?),(.+?)\;/);

    if (matches) {
      processCommand(matches[1], matches[2]);
      data = data.replace(/^.+?\;/, "");
    }
  });

  screen.key(["escape", "q", "C-c"], function(ch, key) {
    process.exit(0);
  });

  screen.key(["up"], (ch, key) => {
    log.log("vol up");
    port.write("21;", err => {});
  });

  screen.key(["down"], (ch, key) => {
    log.log("vol down");
    port.write("22;", err => {});
  });

  screen.key(["left"], (ch, key) => {
    log.log("seek left");
    port.write("12;", err => {});
  });

  screen.key(["right"], (ch, key) => {
    log.log("seek right");
    port.write("11;", err => {});
  });

  screen.key(["z"], (ch, key) => {
    port.write("0;", err => {});
  });

  screen.on("mouse", e => {
    log.log(e);
  });

  port.write("0;", err => {});

  screen.append(vol);
  screen.append(lcd);
  screen.append(log);

  screen.enableMouse();
  screen.render();
} else {
  SerialPort.list()
    .then(ports => {
      console.log("Available COM Ports:");
      ports.map(port => {
        console.log(`  ${port.comName}: ${port.manufacturer} [${port.pnpId}]`);
      });
    })
    .catch(e => console.log(e));
}
