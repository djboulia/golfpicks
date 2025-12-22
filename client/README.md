# Golfpicks Application

This project uses Angular v20 and was started with TailAdmin Angular.

TailAdmin Angular comes with essential UI components and layouts for building **feature-rich, data-driven dashboards** and **admin panels**. TailAdmin Angular is built on:

* **Angular 20+**
* **TypeScript**
* **Tailwind CSS v4**

### Quick Links

- ✨ [Visit Website](https://tailadmin.com/)
- 🚀 [Angular Demo](https://angular-demo.tailadmin.com/)
- 📄 [Documentation](https://tailadmin.com/docs)
- ⬇️ [Download](https://tailadmin.com/download)
- 🖌️ [Figma Design File (Free Edition)](https://www.figma.com/community/file/1463141366275764364)
- ⚡ [Get PRO Version](https://tailadmin.com/pricing)
---

## Installation

```bash
npm install
npm start
```

# Application details

This application started as an Angular v1 application back in 2016. The original implementation uses SCSS for styling and Bootstrap v3 for the UI framework. The application has been migrated to Angular v20 and now uses Tailwind CSS for styling.

## Authentciation

This application defines an `AuthGuard` located in `app.guard.ts` that protects routes from unauthenticated access. The guard checks the backend via the `/shared/services/auth/auth-session.service.ts` to see if the user is logged in before allowing access to specific routes.  If not logged in, the user is redirected to the login page.

The login page is located at `/login` and the logout page at `/logout`. These pages use the `LoginComponent` and `LogoutComponent` components located in `/pages/auth-pages` respectively.

Once logged, the user can access protected routes as defined in `app.routes.ts`.

The login page under the `pages/auth-pages` uses the `LoginFormComponent` located in `/shared/components/auth/login-form` to handle user login. This component collects the user's email and password and calls the `AuthService` to perform the login operation.

There is no logout page; instead, the logout functionality is handled directly by calling the `AuthService` to log the user out and then redirects them to the login page.

## Theming

The `styles.css` file located in the `src` folder contains the global styles for the application. This file includes the Tailwind CSS directives and custom styles for theming the application.  The app supports light and dark themes, which can be toggled by the user. The theme preference is stored in the browser's local storage and applied on app initialization. `--color-brand-xxx` specify the primary brand color (green in this case). The `--color-theme-light-xxx` and `--color-theme-dark-xxx` variables define the base palette for light and dark modes respectively. 

## Layout

The `layout` folder located in `src/app/shared/layout` contains the layout components for the application.  This includes the header and sidebar components.  These are responsive and adapt to different screen sizes. The sidebar can be toggled open and closed, and the header contains navigation links and user profile information.