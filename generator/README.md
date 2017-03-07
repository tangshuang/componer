1) setup your project

You could install bower to support bower components in your poject. And create a `.bowerrc` to set default config of bower.

Babel config is default put in package.json. You could mv it to `.babelrc`. However, if you want to publish your project minimality, you could just change package.json.

`.jshintrc` is used to check your code, if you want to ignore some warning, add this file and add your own rules.

2) minimality share project

If you want to share your project minimality, you can only pack `components`, `.componerrc` and `package.json`, push them to git registry.

```
- componouts
  |- componout1
  |- componout2
  `- ...
- .componerrc
- package.json
```

**Notice:** do NOT push your test reporters, preview tmp dirs and dist dirs to your registry.

After another developer cloned your code, he/she could only run:

```
componer reset -I
```

All componer relative files will be recover.
