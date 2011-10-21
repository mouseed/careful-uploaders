# UploadCare Widgets

## Development

To develop, test and build you need [Node.js] and [npm] to install
JS dependencies. For example, for Ubuntu:

```
sudo add-apt-repository ppa:chris-lea/node.js
sudo add-apt-repository ppa:gias-kay-lee/npm
sudo apt-get update
sudo apt-get install nodejs npm
```

Next to install NPM dependencies run in project dir:

```
npm install
```

To build CSS styles for widget you need [Compass]. For example, for Ubuntu:

```
sudo apt-get install ruby1.9.1 ruby1.9.1-dev
sudo gem1.9.1 install compass --no-user-install --bindir /usr/bin
```

[Node.js]: http://nodejs.org/
[npm]: http://npmjs.org/
[Compass]: http://compass-style.org/

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

### Use

To use widgets in production, you need to put hidden input field with corresponding role into your upload form. Example:
```html
<form action="/some_upload" method="POST">
  <input type="hidden" role="uploadcare-plain-uploader" />
  <input type="submit" />
</form>
```

Then drop built JS files to your 'javascripts' directory and include them:
```html
<script src="/javascripts/plain-widget.js" data-public-key="YOUR_KEY"></script>
```

And you're ready to go.
