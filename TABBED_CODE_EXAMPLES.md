# Tabbed Code Examples Guide

## Overview

The CIN Plugin documentation website now supports tabbed code examples, allowing you to show Blueprint examples by default with C++ examples in an optional tab. This makes the documentation more accessible to Blueprint-focused users while still providing C++ reference for those who need it.

## Features

- **Blueprint-First**: Blueprint examples are always shown first and active by default
- **Optional C++**: C++ examples are in a separate tab that users can click to view
- **Smooth Transitions**: Animated tab switching with visual feedback
- **Consistent Styling**: Matches the existing Code Furnace design system
- **Accessible**: Keyboard navigation and semantic HTML

## HTML Structure

### Basic Two-Tab Example (Blueprint + C++)

```html
<div class="code-tabs-container">
  <div class="code-tabs-header">
    <button class="code-tab-button" data-lang="blueprint">
      Blueprint
    </button>
    <button class="code-tab-button" data-lang="cpp">
      C++
    </button>
  </div>
  
  <div class="code-tab-content">
    <pre><code>// Blueprint example code here
Event BeginPlay
→ Get Controlled Pawn
→ Get Utility Brain From Pawn
→ Is Brain Active
  → True: Continue
  → False: Show Warning</code></pre>
  </div>
  
  <div class="code-tab-content">
    <pre><code class="language-cpp">// C++ example code here
#include "CIN_UtilityAILibrary.h"

void AMyController::BeginPlay()
{
    Super::BeginPlay();
    
    APawn* ControlledPawn = GetPawn();
    UUtilityBrainComponent* Brain = UCIN_UtilityAILibrary::GetUtilityBrainFromPawn(ControlledPawn);
    
    if (Brain && Brain->IsBrainActive())
    {
        // Continue
    }
    else
    {
        // Show Warning
    }
}</code></pre>
  </div>
</div>
```

### With Language Badges (Optional)

You can add visual badges to the tab buttons:

```html
<button class="code-tab-button" data-lang="blueprint">
  Blueprint <span class="lang-badge">Primary</span>
</button>
<button class="code-tab-button" data-lang="cpp">
  C++ <span class="lang-badge">Advanced</span>
</button>
```

## Converting Existing Code Examples

### Before (Inline Code Blocks)

```html
<h3>Example Usage</h3>

<p><strong>Blueprint</strong></p>
<pre><code>// Blueprint code
Event BeginPlay
→ Do Something</code></pre>

<p><strong>C++ (minimal example)</strong></p>
<pre><code class="language-cpp">// C++ code
void AMyClass::BeginPlay()
{
    Super::BeginPlay();
    DoSomething();
}</code></pre>
```

### After (Tabbed)

```html
<h3>Example Usage</h3>

<div class="code-tabs-container">
  <div class="code-tabs-header">
    <button class="code-tab-button" data-lang="blueprint">Blueprint</button>
    <button class="code-tab-button" data-lang="cpp">C++</button>
  </div>
  
  <div class="code-tab-content">
    <pre><code>// Blueprint code
Event BeginPlay
→ Do Something</code></pre>
  </div>
  
  <div class="code-tab-content">
    <pre><code class="language-cpp">// C++ code
void AMyClass::BeginPlay()
{
    Super::BeginPlay();
    DoSomething();
}</code></pre>
  </div>
</div>
```

## Best Practices

### 1. Always Put Blueprint First

The first tab is automatically activated, so always structure your tabs with Blueprint first:

```html
<button class="code-tab-button" data-lang="blueprint">Blueprint</button>  <!-- First = Active by default -->
<button class="code-tab-button" data-lang="cpp">C++</button>
```

### 2. Keep Tab Order Consistent

Use the same order across all documentation pages:
1. Blueprint (always first)
2. C++ (always second)

### 3. Match Tab Count with Content Count

Ensure you have the same number of tab buttons as content panels:

```html
<!-- 2 buttons = 2 content panels -->
<div class="code-tabs-header">
  <button>Blueprint</button>
  <button>C++</button>
</div>

<div class="code-tab-content"><!-- Blueprint content --></div>
<div class="code-tab-content"><!-- C++ content --></div>
```

### 4. Use Semantic Code Formatting

- Use `<code class="language-cpp">` for C++ code to enable syntax highlighting
- Blueprint pseudo-code doesn't need a language class

### 5. When to Use Tabs vs Inline

**Use Tabs When:**
- You have both Blueprint and C++ examples for the same concept
- The code examples are substantial (more than 5 lines)
- You want to reduce visual clutter

**Use Inline When:**
- You only have one language example
- The code is very short (1-2 lines)
- It's a quick reference or property list

## Example: Complex Multi-Section Page

```html
<h2>Creating an Action</h2>

<p>Actions can be created in both Blueprint and C++.</p>

<div class="code-tabs-container">
  <div class="code-tabs-header">
    <button class="code-tab-button" data-lang="blueprint">Blueprint</button>
    <button class="code-tab-button" data-lang="cpp">C++</button>
  </div>
  
  <div class="code-tab-content">
    <pre><code>// Create Blueprint child of UtilityActionAsset
1. Right-click in Content Browser
2. Blueprint Class → Utility Action Asset
3. Name it BP_AttackAction
4. Configure in Details panel</code></pre>
  </div>
  
  <div class="code-tab-content">
    <pre><code class="language-cpp">// MyAttackAction.h
#pragma once
#include "UtilityActionAsset.h"
#include "MyAttackAction.generated.h"

UCLASS()
class UMyAttackAction : public UUtilityActionAsset
{
    GENERATED_BODY()
public:
    virtual void Execute() override;
};</code></pre>
  </div>
</div>

<h2>Configuring the Action</h2>

<div class="code-tabs-container">
  <div class="code-tabs-header">
    <button class="code-tab-button" data-lang="blueprint">Blueprint</button>
    <button class="code-tab-button" data-lang="cpp">C++</button>
  </div>
  
  <div class="code-tab-content">
    <pre><code>// In Blueprint Details Panel
Base Score: 60.0
Priority: 1.0
bInterruptible: true</code></pre>
  </div>
  
  <div class="code-tab-content">
    <pre><code class="language-cpp">UMyAttackAction::UMyAttackAction()
{
    BaseScore = 60.0f;
    Priority = 1.0f;
    bInterruptible = true;
}</code></pre>
  </div>
</div>
```

## Styling Customization

The tabs use CSS custom properties from the existing theme:

- `--cf-cyan`: Primary accent color for active tabs
- `--bg-code`: Code background
- `--bg-tertiary`: Tab header background
- `--text-secondary`: Inactive tab text
- `--ease-out-expo`: Smooth transitions

To customize, modify `styles.css` under the `/* Tabbed Code Examples */` section.

## JavaScript Initialization

The tab system is automatically initialized when:
1. A plugin page loads (`setupPluginView`)
2. Hash changes (page navigation)

No manual initialization is needed. The code is in `app.js`.

## Troubleshooting

### Tabs Not Working

**Problem**: Clicking tabs doesn't switch content

**Solutions**:
1. Check that `app.js` is loaded
2. Verify you have matching numbers of buttons and content panels
3. Open browser console for JavaScript errors

### First Tab Not Active

**Problem**: No tab is active by default

**Solutions**:
1. Ensure `initializeCodeTabs()` is called after content loads
2. Check that `.code-tabs-container` class is correctly applied
3. Verify the JavaScript timeout is sufficient (default 100ms)

### Styling Issues

**Problem**: Tabs look broken or unstyled

**Solutions**:
1. Verify `styles.css` includes the tabbed code examples section
2. Check for CSS conflicts with existing code block styles
3. Clear browser cache

## Migration Checklist

When converting documentation pages to use tabbed examples:

- [ ] Identify pages with both Blueprint and C++ examples
- [ ] Replace heading-separated code blocks with tabbed structure
- [ ] Ensure Blueprint is always the first tab
- [ ] Test tab switching on each page
- [ ] Verify code syntax highlighting still works
- [ ] Check responsive behavior on mobile
- [ ] Update any screenshots or visual documentation

## Future Enhancements

Potential improvements to consider:

1. **Remember Tab Preference**: Store user's tab preference in localStorage
2. **Keyboard Navigation**: Add arrow key support for tab switching
3. **Copy Button**: Add "Copy to Clipboard" button for each code panel
4. **Multi-Language Support**: Add support for more languages (Python, Lua, etc.)
5. **Sync Tabs**: Option to sync tab selection across all code examples on a page

---

**Created**: 2025-10-26
**Version**: 1.0
**Status**: Production Ready
