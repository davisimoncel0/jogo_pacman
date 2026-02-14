const { exec } = require('child_process');
const os = require('os');

const PORT = 3000;

function killPort(port) {
  const platform = os.platform();

  if (platform === 'win32') {
    // Windows logic
    exec(`netstat -ano | findstr :${port}`, (err, stdout) => {
      if (err || !stdout) {
        console.log(`Windows: Porta ${port} livre ou erro ao verificar.`);
        return;
      }
      
      // Parse PID (last token in the line)
      const lines = stdout.trim().split('\n');
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        
        if (pid) {
          exec(`taskkill /PID ${pid} /F`, (err) => {
            if (!err) console.log(`Processo ${pid} na porta ${port} encerrado.`);
          });
        }
      });
    });
  } else {
    // Mac/Linux logic
    exec(`lsof -t -i:${port}`, (err, stdout) => {
      if (err || !stdout) {
        // Quietly fail if nothing is running, or log if desired
        return;
      }

      const pids = stdout.trim().split('\n');
      pids.forEach(pid => {
        if (pid) {
          exec(`kill -9 ${pid}`, (err) => {
            if (!err) console.log(`Processo ${pid} na porta ${port} encerrado.`);
          });
        }
      });
    });
  }
}

killPort(PORT);
