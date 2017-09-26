module.exports = {
  "extends": "airbnb-base",
  "plugins": [],
  "rules": {
    "func-names": "off",
    // doesn't work in node v4 :(
    "strict": "off",
    "prefer-rest-params": "off",
    "react/require-extension" : "off",
    "import/no-extraneous-dependencies" : "off",
    "comma-dangle": "off",
    "no-unused-expressions": "off"
  },
  "env": {
    "mocha": true
  },
  "settings": {
    "import/resolver": "webpack"
  }
};
