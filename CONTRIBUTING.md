# Contributing to Rapha

First off, thank you for considering contributing to Rapha! It's people like you that make Rapha such a great privacy-first health data management protocol.

## Where do I go from here?

If you've noticed a bug or have a question, please search the [issue tracker](https://github.com/example/rapha/issues) to see if someone else in the community has already created a ticket. If not, go ahead and make one!

## Fork & create a branch

If this is something you think you can fix, then fork Rapha and create a branch with a descriptive name.

A good branch name would be (where issue #325 is the ticket you're working on):

```bash
git checkout -b 325-add-new-encryption-algo
```

## Get the test suite running

Make sure you're running the latest Node.js and npm versions. Install dependencies and start the local environment:

```bash
npm install
npm run devnet:start
npm run test:contracts
```

Ensure all tests pass before making your changes.

## Implement your fix or feature

At this point, you're ready to make your changes. Feel free to ask for help; everyone is a beginner at first :smile_cat:

## Make a Pull Request

At this point, you should switch back to your master branch and make sure it's up to date with Rapha's master branch:

```bash
git remote add upstream git@github.com:example/rapha.git
git checkout master
git pull upstream master
```

Then update your feature branch from your local copy of master, and push it!

```bash
git checkout 325-add-new-encryption-algo
git rebase master
git push --set-upstream origin 325-add-new-encryption-algo
```

Finally, go to GitHub and make a Pull Request! :tada:

## Keeping your Pull Request updated

If a maintainer asks you to "rebase" your PR, they're saying that a lot of code has changed, and that you need to update your branch so it's easier to merge.

## License

By contributing to Rapha, you agree that your contributions will be licensed under its MIT License.
