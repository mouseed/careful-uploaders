# UploadCare Widgets

## Development

To develop, test and build you need [Node.js] and [npm] to install
JS dependencies. For example, for Ubuntu:

```
sudo apt-get install npm
```

Next to install NPM dependencies run in project dir:

```
npm install
```

[Node.js]: http://nodejs.org/
[npm]: http://npmjs.org/

### Testing

There are 2 types of tests for widgets:

* Unit tests. To run it just call `./node_modules/.bin/cake test` in project dir
  and open <http://localhost:8124/> in browser.
* Integration tests. To run it just call `./node_modules/.bin/cake watch`
  in project dir and test HTML in browser.

### Build

To build production ready JS files of widgets just call in project dir:

```
./node_modules/.bin/cake build
```
