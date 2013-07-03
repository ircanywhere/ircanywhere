from werkzeug.debug import get_current_traceback
from websites.ircanywhere import app
from controllers import notfound, index, init, javascript, login, logs, logout, settings, signup, reset, network

@app.errorhandler(500)
def internal_server_error(e):
	base = os.path.dirname(os.path.abspath(__file__))
	f = open('%s/logs/error.log' % (base), 'a')
	track = get_current_traceback(skip=1, show_hidden_frames=True, ignore_system_exceptions=False)
	track.log(f)
	f.close()

	return 'An error has occured', 500

@app.errorhandler(404)
def page_not_found(e):
	return notfound.controller.get(), 404

@app.route('/')
def index_route_get():
	return index.controller.get()

@app.route('/init')
def init_route_get():
	return init.controller.get()

@app.route('/javascript')
def js_route_get():
	return javascript.controller.get()

@app.route('/login', methods=['POST'])
def login_route_get():
	return login.controller.post()

@app.route('/logout')
def logout_route_get():
	return logout.controller.get()

@app.route('/network')
def network_route_get():
	return network.controller.get()

@app.route('/settings')
def settings_route_get():
	return settings.controller.get()

@app.route('/settings/settings', methods=['POST'])
def set_settings_route_post():
	return settings.controller.post(req_type = 'settings')

@app.route('/settings/email', methods=['POST'])
def set_email_route_post():
	return settings.controller.post(req_type = 'email')

@app.route('/settings/password', methods=['POST'])
def set_password_route_post():
	return settings.controller.post(req_type = 'password')

@app.route('/signup')
@app.route('/signup/<code>')
def signup_route_get(code = None):
	return signup.controller.get(code = code)

@app.route('/signup', methods=['POST'])
@app.route('/signup/<code>', methods=['POST'])
def signup_route_post(code = None):
	return signup.controller.post(code = code)

@app.route('/reset/<_id>')
def reset_route_get(_id = None):
	return reset.controller.get(_id = _id)

@app.route('/reset/<req_type>', methods=['POST'])
def reset_route_post(req_type = None):
	return reset.controller.post(req_type = req_type)

@app.route('/logs/<network>/<channel>')
def logs_route_one_get(network = None, channel = None, date = None):
	return logs.controller.get(req_type = 'default-channel-view', network = network, channel = channel, date = date)

@app.route('/logs/<network>/<channel>/<date>')
def logs_route_two_get(network = None, channel = None, date = None):
	return logs.controller.get(req_type = 'channel-view', network = network, channel = channel, date = date)
