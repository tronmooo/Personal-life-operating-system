# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e3]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - heading "Welcome Back" [level=3] [ref=e7]
        - paragraph [ref=e8]: Sign in to your AI Concierge account
      - generic [ref=e9]:
        - button "Continue with Google" [ref=e11]:
          - img [ref=e12]
          - text: Continue with Google
        - generic [ref=e18]: Or continue with email
        - generic [ref=e19]:
          - generic [ref=e20]:
            - text: Email
            - textbox "Email" [ref=e21]:
              - /placeholder: name@example.com
          - generic [ref=e22]:
            - text: Password
            - textbox "Password" [ref=e23]:
              - /placeholder: ••••••••
          - button "Sign In" [ref=e24]
          - paragraph [ref=e25]: Don't have an account? Click the link below to sign up.
        - button "Don't have an account? Sign up" [ref=e27]
  - generic [ref=e28]:
    - button [ref=e29]:
      - img [ref=e30]
    - button [ref=e40]:
      - img [ref=e41]
```