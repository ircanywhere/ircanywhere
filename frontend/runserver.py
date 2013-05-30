import os
from websites.ircanywhere import app

pid = str(os.getpid())
f = open('frontend/frontend.pid', 'w')
f.write(pid)
f.close()

app.run(host = '0.0.0.0', port = 5000, debug = True)