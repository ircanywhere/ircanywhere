.. IRCAnywhere documentation master file, created by
   sphinx-quickstart on Tue Feb 18 16:37:43 2014.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

Welcome to IRCAnywhere's documentation!
=======================================

Contents:

.. toctree::
   :maxdepth: 2

This is the latest version of IRCAnywhere which has been rewrote
completely from the ground up. A lot of effort has gone into this over
the past 3-4 month and it's still very much alpha, however in a much
better state than it previously was. For the sake of moving the project
on, the old code in ``0.1.0-unstable`` will be removed from the
repository in the future, if you're interested in a copy get in touch.

The current version is at ``0.2-alpha`` and is lacking in a decent
amount of features compared to other IRC clients but it has the ability
to keep connections online. This version is being released in an effort
to let people use it as they need and eliminate any critical and early
arriving bugs so we can concentrate on stabilising the code and adding
features as time goes on.

A list of things that you would expect right now that are not in the
system but will be getting implemented in the ``0.2-beta`` or ``0.2.0``
releases are as follows, please do not open issues or raise these
'problems' in the IRC channel because they are priorities on the todo
list for features.

-  The ability to handle and view channel lists / links list and all
   kinds of ban and exception lists
-  Tab selection in the input box
-  Loading more backlog by scrolling to the top and pressing a button
-  Automatic websocket reconnection

The next steps are to get the major issues ironed out and start work on
the next `Roadmap`_. The majority of changes between ``0.2-alpha`` and
``0.2-beta`` will be bug fixes and improvements to the API. The features
outlined above will be implemented, any minor / other non critical
feature requests will be moved back to the later version. There is a
wiki page on `contributing`_ if anyone is interested, it outlines coding
standards along with the roadmap for ``0.2-beta``.

Either prior to ``0.2.0`` final release or shortly after work will begin
on a powerful plugin API allowing people to highly customise a lot of
the application (backend and frontend). Some ideas have been noted, if
anyone is interested in contributing or discussing this speak to me in
IRC.

Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`

Issues
======

Any bugs (preferably) should be reported via the issues page on this
repository, it would be ideal if a screenshot of the bug could be
provided (if applicable) and any errors in the javascript console log.

https://github.com/ircanywhere/ircanywhere/issues

.. _Roadmap: https://github.com/ircanywhere/ircanywhere/wiki/0.2.0-beta-Roadmap
.. _contributing: https://github.com/ircanywhere/ircanywhere/wiki/Contributing