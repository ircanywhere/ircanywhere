import sys
sys.path.insert(0, '/home/ec2-user/frontend')
activate_this = '/home/ec2-user/frontend/venv/bin/activate_this.py'
execfile(activate_this, dict(__file__=activate_this))

from websites.ircanywhere import app as application