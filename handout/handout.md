# How Computers See: SVD Image Compression

## Mathematical Core

### SVD Definition
Let $A\in\mathbb{R}^{m\times n}$. The **SVD** is

$$A = U\Sigma V^\top$$

where:
- $U\in\mathbb{R}^{m\times m}$ orthogonal
- $V\in\mathbb{R}^{n\times n}$ orthogonal  
- $\Sigma=\operatorname{diag}(\sigma_1,\dots,\sigma_r)$
- $\sigma_1\ge\dots\ge\sigma_r>0$ are singular values
- $r=\operatorname{rank}A$

### Rank-k Approximation (Eckart–Young)
For $1\le k<r$,

$$A_k = \sum_{i=1}^k \sigma_i u_i v_i^\top$$

minimizes $\|A-A_k\|_2$ and $\|A-A_k\|_F$ among all rank-$k$ matrices.

### Storage Cost
Storing $A_k$ costs $k(m+n+1)$ scalars vs. $mn$.

**Example**: $256\times256$ image, $k=30$ ⇒ 30 × (256+256+1)=15,630 numbers (≈ 15 kB in 8-bit) vs 65,536.

## Connection to Course Themes

- **Orthogonality**: $U,V$ columns form orthonormal bases
- **Spectral theorem**: symmetric case $A=A^\top$ ⇒ SVD reduces to eigendecomposition
- **Least-squares**: truncated SVD underpins pseudoinverse $A^+ = V\Sigma^+U^\top$

## True/False Quiz

1. **T/F**: For any matrix, SVD always exists. **(True)**
2. **T/F**: Keeping more singular values always lowers reconstruction error. **(True)**
3. **T/F**: Rank-$k$ approximation is unique for each $k$. **(False)** — unique only if $\sigma_k>\sigma_{k+1}$.
4. **T/F**: In a square symmetric matrix, singular values equal absolute eigenvalues. **(True)**

## References

1. Strang, G. (2016). *Introduction to Linear Algebra*. Wellesley–Cambridge Press.
2. Eckart, C., & Young, G. (1936). The Approximation of One Matrix by Another of Lower Rank. *Psychometrika*.
3. Sanderson, G. (2019). Singular value decomposition. *3Blue1Brown video*. https://youtu.be/P5mlg91as1c

## Interactive Demo

Visit the web application to:
- Upload images and see real-time compression
- Adjust rank parameter with live preview
- Visualize singular values
- Take the interactive quiz

**Key Insight**: "Rank-k SVD keeps what matters and throws away the rest."
