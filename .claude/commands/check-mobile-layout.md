description: Check RWD layouts on common devices

## Arguments
- $ARGUMENTS: List of actions to perform on the page before checking layout.
  - Example: ["click #showMore", "scrollTo #section3"]

## Task
1. Open Chromium using Playwright MCP
2. Define devices to check:
   - iPhone 14: width 375, height 812
   - Large Mobile: width 425, height 896
   - Tablet: width 768, height 1024
3. For each device:
   - Emulate viewport width and height
   - Determine `isPhone`:
     - `true` if viewport width < 768
     - `false` if viewport width >= 768
   - Go to localhost:3000
   - Wait for network idle
   - Perform all actions in $ARGUMENTS in order
   - Take a full-page screenshot  and name it using the device name (e.g., iPhone14.png)
   - Check for:
     - Horizontal overflow
     - Elements extending beyond viewport
     - Fixed headers covering content
     - For each layout issue, report it considering the device type (`isPhone`):
       - Mobile layout if isPhone = true
       - Tablet/Desktop layout if isPhone = false
4. Return:
   - Screenshots for each device
   - List of layout issues per device
   - Ask me before really modifying or fixing anything
   - When fixing/modifying, ensure layout works for both:
     - Mobile (<768px)
     - Tablet/Desktop (>=768px)
