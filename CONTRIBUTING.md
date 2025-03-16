# Contributing Guidelines

## Branch Strategy

We follow a trunk-based development workflow with the following branches:

- `main` - Production branch, contains stable releases
- `dev` - Development branch, all feature work branches from here

## Branch Naming Conventions

When creating a new feature branch, use the following format:
```
feature/[brief-description]
```

Examples:
- `feature/add-user-authentication`
- `feature/improve-analytics-dashboard`

For bug fixes:
```
fix/[brief-description]
```

Examples:
- `fix/login-validation`
- `fix/analytics-count`

## Development Workflow

1. Create a new branch from `dev` using the appropriate naming convention
2. Make your changes and commit them with clear, descriptive messages
3. Push your branch and create a pull request to merge into `dev`
4. After review and testing, changes will be merged into `dev`
5. Periodically, `dev` will be merged into `main` for production releases

## Commit Message Guidelines

Write clear, concise commit messages that describe what the change does:

```
feat: add bulk restore feature for archived items
fix: correct feature count in analytics dashboard
docs: update README with new API endpoints
```

## Pull Request Process

1. Update relevant documentation
2. Add appropriate tests if applicable
3. Ensure all checks pass
4. Request review from at least one team member
5. Squash commits before merging if necessary
