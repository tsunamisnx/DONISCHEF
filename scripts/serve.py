#!/usr/bin/env python3
"""Dependency-free local preview. Listens only on this computer."""

import argparse
import errno
import functools
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import threading
import webbrowser


def main():
    parser = argparse.ArgumentParser(description="Локальный просмотр сайта Дони Шеф")
    parser.add_argument("--port", type=int, default=4173)
    parser.add_argument("--no-open", action="store_true", help="Не открывать браузер автоматически")
    args = parser.parse_args()
    root = Path(__file__).resolve().parent.parent
    handler = functools.partial(SimpleHTTPRequestHandler, directory=str(root))
    try:
        server = ThreadingHTTPServer(("127.0.0.1", args.port), handler)
    except OSError as error:
        if error.errno != errno.EADDRINUSE:
            raise
        server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    url = "http://127.0.0.1:{}/".format(server.server_port)
    print("\nДони Шеф — локальный просмотр\n{}\n\nДля остановки нажмите Ctrl+C.\n".format(url), flush=True)
    if not args.no_open:
        threading.Timer(0.4, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nПросмотр остановлен.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
