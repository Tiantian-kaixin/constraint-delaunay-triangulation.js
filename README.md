# constraint-delaunay-triangulation
## introduction
>use constraint delaunay triangulation method to create low-poly pictrue.<br>

## Algorithm Overview
### Canny edge detection
>Detect edges using optimized canny edge detection.<br>
### Douglas–Peucker algorithm
>Simplify the line and then insert the extra long line segments.<br>
### Expansion method vertex optimization
>Further optimization of vertices by method of edge feature point expansion.<br>
### Constraint delaunay triangulation generate
>Generate constraint delaunay triangulation.<br>
### Fill color
>Select the triangle center color to fill the entire triangle.<br>
## Attention
>Due to the large amount of calculation, the input picture graphic structure should be as simple as possible, and the size should not be too large, so as not to take too long and not respond.<br>
## sample
<div align=center><img src="https://github.com/Tiantian-kaixin/constraint-delaunay-triangulation.js/raw/master/sample/result.png" width="500" /><br></div>
## reference
>reference paper：'Artistic Low Poly rendering for images'<br>
>(http://or.nsfc.gov.cn/bitstream/00001903-5/336217/1/1000014012719.pdf)
