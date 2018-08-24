# constraint-delaunay-triangulation
## introduction
>use constraint delaunay triangulation method to create low-poly pictrue.<br>
### General process
<div align=center><img src="https://github.com/Tiantian-kaixin/constraint-delaunay-triangulation.js/raw/master/sample/progress.png"  width="400"/></div><br>
## Algorithm Overview
### Canny edge detection
>Detect edges using optimized canny edge detection
### Douglas–Peucker algorithm
>Simplify the line and then insert the extra long line segments
### Expansion method vertex optimization
>Further optimization of vertices by method of edge feature point expansion
### Constraint delaunay triangulation generate
>Generate constraint delaunay triangulation
### Fill color
>Select the triangle center color to fill the entire triangle
## Attention
>Due to the large amount of calculation, the input picture graphic structure should be as simple as possible, and the size should not be too large, so as not to take too long and not respond.
## sample
<div align=center><img src="https://github.com/Tiantian-kaixin/constraint-delaunay-triangulation.js/raw/master/sample/result.png" width="500" /><br></div>
## reference
>reference paper：'Artistic Low Poly rendering for images'<br>
>(http://or.nsfc.gov.cn/bitstream/00001903-5/336217/1/1000014012719.pdf)
