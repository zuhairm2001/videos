# Brief — Azure Kubernetes Fleet Manager

## Purpose
A 60-second promo that introduces Azure Kubernetes Fleet Manager. It should make the idea feel obvious: one control plane for many Kubernetes clusters. It covers safe updates across the fleet, intelligent workload placement, and governance applied from one place.

## Audience
Platform engineers, SREs and infrastructure leads who already run AKS, or other Kubernetes, and whose cluster count keeps growing. They know Kubernetes well, don't want a basic explainer, and respect precision.

## Core message
"Seamlessly manage Kubernetes clusters at scale." Take many clusters in many places and run them as one fleet, from a single hub.

## Format
- 16:9, 1920×1080, 30 fps, 60 s
- No voice-over. On-screen type, music and SFX carry the message and set the pace
- Rendered from a WebGL canvas and exported frame by frame

## Beats (draft, refined in the storyboard)
1. **Hook — sprawl.** Clusters keep multiplying across regions, subscriptions, clouds and on-premises. Each one is its own island with its own version drift.
2. **Reveal.** A single hub lights up, and every cluster joins it as a member of one fleet. The Azure Kubernetes Fleet Manager name appears.
3. **Safe updates.** Update runs move through stages, with approval gates and auto-upgrade profiles. Each stage fills in only after the one before it passes.
4. **Intelligent placement.** Resource placement from the hub picks target clusters by label, property or capacity, then rolls out progressively.
5. **Governance.** Managed Fleet Namespaces set quotas, network policy and RBAC for a namespace across many clusters at once.
6. **Reach.** AKS clusters in any region, plus Arc-enabled clusters on other clouds, on-premises and at the edge (preview). Also: DNS-based load balancing across clusters (preview) and centralized monitoring.
7. **CTA.** Product name, "No charge for the Fleet Manager resource itself" (true: you pay only for the hub AKS cluster if you create one), and the product URL.

## Claims guardrails
Every claim must be traceable to [the product page](https://azure.microsoft.com/en-us/products/kubernetes-fleet-manager) or [the docs overview](https://learn.microsoft.com/en-us/azure/kubernetes-fleet/overview).
- Arc-enabled member clusters, Managed Fleet Namespaces (flagged preview on the product page), Automated Deployments, DNS load balancing and cross-cluster networking are **preview** features. Label them as preview on screen, or leave them out.
- Don't invent customer numbers or fleet sizes. Any counts in the animation are illustrative only.

## Tone
Calm, engineered, confident: an industrial spec sheet coming to life. The look is dot-matrix and hairline grids, not cyberpunk, and uses Azure blue and Fleet Manager purple.
