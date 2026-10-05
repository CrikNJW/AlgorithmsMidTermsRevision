# Question-bank update: study focus

All 340 original questions and their answers are preserved. Every question is now tagged Arithmetic or Conceptual. Arithmetic includes exact calculations, counts and concrete execution traces; Conceptual includes principles, proofs and symbolic asymptotic reasoning.

**120 new conceptual questions** were added as Set 4: 20 per lecture, IDs L0-61–L0-80 through L5-61–L5-80. The total is now 460 questions.

Session focus targets 75% arithmetic, 50% arithmetic, or 25% arithmetic for Arithmetic, Balanced, and Conceptual respectively. The slider permits any custom arithmetic percentage from 0 to 100 in 1% steps; conceptual is the remainder. Counts are rounded to whole questions. The closest available mix is used while keeping lecture coverage balanced, and the actual counts are shown before starting. All-selected sessions contain the whole selected pool.

## Lecture 0: new Set 4

| ID | Format | New question |
| --- | --- | --- |
| L0-61 | fib | A preprocessed index still describes yesterday’s data after the underlying data changes. Before relying on its answers, the index must be _____. Use updated or ignored. |
| L0-62 | match | Match each preprocessing situation to the main issue it raises. |
| L0-63 | mcq | A search routine is fast only after rebuilding an index before every request. What should a fair performance comparison include? |
| L0-64 | fib | Whether a one-time preprocessing step is worthwhile depends on how often its results will be _____. Use reused or discarded. |
| L0-65 | fib | “A method has faster lookups, so it must be faster overall even for a single query.” This conclusion is _____. Use justified or unjustified. |
| L0-66 | fib | A method exceeds the application’s hard memory limit. Even if it is faster, that implementation is _____ under the stated limit. Use feasible or infeasible. |
| L0-67 | fib | A cache key omits an input that can change the result. Reusing a cached answer may then compromise _____. Use correctness or formatting. |
| L0-68 | match | Match each evaluation mistake to the improvement it needs. |
| L0-69 | mcq | A specification allows any one of several equally good answers. Two algorithms return different allowed answers. What follows? |
| L0-70 | mcq | A new test suite contains no failing examples. Which claim is justified by that observation alone? |
| L0-71 | mcq | A routine is required to return both a sorted array and its original elements unchanged in number. Which check addresses the second requirement? |
| L0-72 | mcq | Why is it misleading to compare a routine that finds one match with a routine that finds all matches as if they solved the same task? |
| L0-73 | mcq | Two data structures support the same operations but favor different operation types. What information best helps select one? |
| L0-74 | mcq | A recursive solution allocates no explicit array, but keeps many unfinished calls. Which conclusion is sound? |
| L0-75 | mcq | An optimization makes most inputs faster but changes the required output on one valid input. How should it be judged? |
| L0-76 | mcq | Why should testing include the smallest input size allowed by the specification? |
| L0-77 | mcq | A routine outputs correct answers whenever it finishes, but its termination is unproved. What additional obligation remains for a specification requiring an answer on every valid input? |
| L0-78 | mcq | Two implementations are timed using different input distributions. What makes their average timings difficult to compare? |
| L0-79 | match | Match each requirement to what must be established. |
| L0-80 | match | Match each review question to its primary concern. |

## Lecture 1: new Set 4

| ID | Format | New question |
| --- | --- | --- |
| L1-61 | fib | In Gale–Shapley, every proposal uses a proposer–receiver pair that has not been used before. Because the set of such pairs is finite, this establishes _____. Use termination or uniqueness. |
| L1-62 | fib | Enumerating every perfect matching does not make every candidate stable; each candidate still needs a check for a _____ pair. |
| L1-63 | fib | Exhaustive subset generation makes an include-or-_____ decision for each element. |
| L1-64 | fib | Without extra information about an unsorted array, skipping an element can miss the maximum. A guaranteed maximum search must inspect _____ element. Use every or only-the-first. |
| L1-65 | fib | To express runtime as a function of the full preference input, the size measure must include the preference _____, not just the participant names. |
| L1-66 | fib | Generating every perfect matching and testing each one is an _____ search strategy. |
| L1-67 | fib | To compare n^2.5 with n² log₂ n asymptotically, behavior at a single fixed n is _____. Use sufficient or insufficient. |
| L1-68 | fib | Changing an exponential base from 10 to 100 can be discarded as a constant multiplier of the whole function. This claim is _____. Use true or false. |
| L1-69 | mcq | A proposer prefers a receiver to their final partner. The receiver rejected that proposer earlier and only improved partners afterward. What does this establish? |
| L1-70 | mcq | Under complete strict preferences, proposer-optimal means each proposer gets which partner? |
| L1-71 | mcq | Why can swapping which side proposes change the Gale–Shapley outcome? |
| L1-72 | mcq | The standard lecture proof assumes complete preference lists. If some partners are unacceptable, what is the sound conclusion? |
| L1-73 | mcq | A receiver compares two proposals. Which information determines the preferred one? |
| L1-74 | mcq | A brute-force search stops at the first perfect matching without testing stability. What requirement may it miss? |
| L1-75 | mcq | In the standard algorithm, can a receiver voluntarily replace a current partner with someone lower on their preference list? |
| L1-76 | mcq | Why should algorithm analysis clearly say whether n counts participants per side or all preference entries? |
| L1-77 | mcq | Why can finding one stable matching be much cheaper than listing every perfect matching? |
| L1-78 | mcq | Which property explains why binary search can avoid scanning a sorted input from beginning to end? |
| L1-79 | match | Match each property to the issue it settles. |
| L1-80 | match | Match each preference statement to its meaning. |

## Lecture 2: new Set 4

| ID | Format | New question |
| --- | --- | --- |
| L2-61 | fib | In a pair scan, requiring i < j avoids self-pairs and counts each unordered pair _____. Use once or twice. |
| L2-62 | fib | When an inner loop runs i times for outer values i=1,…,n, its total is a _____ over the changing inner-loop lengths. Use sum or maximum. |
| L2-63 | fib | The notation (lg n)² means the logarithm is taken first and its result is then _____. |
| L2-64 | fib | An outer loop has logarithmically many iterations but its body does increasing work. Counting outer iterations alone is _____ to determine total runtime. Use sufficient or insufficient. |
| L2-65 | fib | In a pair scan, starting j at i+1 instead of 0 eliminates reversed duplicates but does not change the tight _____ growth of examining all unordered pairs. Use linear or quadratic. |
| L2-66 | fib | In an O(g(n)) proof, after choosing c and n₀, the same c must work for _____ n ≥ n₀. Use every or one. |
| L2-67 | fib | A proposed Big-O inequality fails for a few small input sizes but holds from a fixed threshold onward. Those finite exceptions _____ the asymptotic claim. Use invalidate or do-not-invalidate. |
| L2-68 | fib | If successful search targets are more likely near the front of a list, treating all target positions as equally likely gives an _____ average-case model. Use appropriate or inappropriate. |
| L2-69 | fib | A measured runtime can calibrate a model T(n)=c·n log n, but the predicted runtime at another size is an _____. Use estimate or exact-guarantee. |
| L2-70 | fib | Using a timing measurement from one machine to predict another machine’s runtime requires reconsidering the model’s constant _____. |
| L2-71 | match | Match each runtime statement to its interpretation. |
| L2-72 | fib | A crossover point between two runtime functions is an input size where their modeled costs are _____. |
| L2-73 | fib | An algorithm has lower asymptotic growth than another. It is therefore guaranteed faster on every small input. This statement is _____. Use true or false. |
| L2-74 | fib | Multiplying one runtime function by a larger positive constant can shift its crossover with another function without changing its tight asymptotic _____. |
| L2-75 | fib | If the inner loop starts at k=j and continues only while k<n, then when j=n its body is _____. Use skipped or executed. |
| L2-76 | mcq | An analysis counts every arithmetic operation as constant time. What must be reconsidered if the operands grow to arbitrarily long integers? |
| L2-77 | mcq | Two algorithms both have tight running time Θ(n²). Which conclusion follows? |
| L2-78 | mcq | A random sample of inputs runs quickly. Why does that alone not prove a small worst-case runtime? |
| L2-79 | mcq | A best-case runtime has a tight bound. Which notation can express that tight bound? |
| L2-80 | mcq | A particular algorithm needs quadratic work in its worst case. Does that by itself prove every algorithm for the problem must do so? |

## Lecture 3: new Set 4

| ID | Format | New question |
| --- | --- | --- |
| L3-61 | fib | After factorial(n−1) returns, factorial(n) still has a pending _____ operation. |
| L3-62 | fib | In F(n)=F(n−1)+F(n−2), the supplied values F(0) and F(1) are the _____ cases. |
| L3-63 | fib | In T(n)=T(n−1)+1, the term outside T(n−1) represents _____ work done by the current call. Use nonrecursive or duplicated. |
| L3-64 | fib | Repeated squaring handles an odd exponent by squaring the half-power and multiplying once more by the _____. |
| L3-65 | fib | While computing recursive factorial, the most recently started unfinished call completes first. This is _____-in, first-out order. |
| L3-66 | fib | If two branches of naive Fibonacci request the same F(k), the plain recursive algorithm _____ it. Use recomputes or reuses. |
| L3-67 | fib | A recurrence gives how one cost depends on smaller costs, but an exact numerical solution also needs a _____ condition. |
| L3-68 | fib | To find a recursion-tree level’s total work, combine the work of _____ nodes on that level. Use all or one. |
| L3-69 | fib | When unrolling T(n)=T(n−1)+n down to its base case, each nonrecursive term must be counted _____. Use once or only-at-the-root. |
| L3-70 | fib | For positive m, Euclid’s algorithm replaces (n,m) with (m,n mod m) because the transformation preserves the greatest common _____. |
| L3-71 | fib | Swapping the arguments of GCD changes its mathematical result. This claim is _____. Use true or false. |
| L3-72 | fib | In a balanced merge-sort recursion tree, the number of subproblems grows while their sizes shrink. The total input size represented at one full level stays _____. Use constant-across-levels or exponential-across-levels. |
| L3-73 | mcq | A recursion tree is wide but shallow. Which quantity directly measures the maximum chain of simultaneously active recursive calls? |
| L3-74 | mcq | A routine has a base case at n=0, but starting from n=1 it recurses only on n+1. What is missing? |
| L3-75 | mcq | Why is multiplying root work by recursion depth not always a valid total-work calculation? |
| L3-76 | mcq | Before applying the lecture’s basic Master theorem, what should be checked? |
| L3-77 | mcq | When proving a recurrence bound by substitution, where can the inductive hypothesis legitimately be applied? |
| L3-78 | mcq | Two implementations return the same power aⁿ. One stores a recursive half-power; the other independently recomputes it twice. Why may their runtimes differ? |
| L3-79 | match | Match each defect in a recursive design to its direct consequence. |
| L3-80 | match | Match each measurement to what it describes. |

## Lecture 4: new Set 4

| ID | Format | New question |
| --- | --- | --- |
| L4-61 | fib | The lecture’s maximum-search code returns pos. This is the _____ of a maximum element, not its value. |
| L4-62 | fib | Selection sort’s inner scan must find the minimum of the _____ portion. Use unsorted or already-fixed. |
| L4-63 | fib | In a complete one-to-one assignment, giving the same job to two applicants makes the assignment _____. Use feasible or infeasible. |
| L4-64 | fib | For Euclidean distance, evaluating both (P,Q) and (Q,P) is _____ when searching for the closest pair. Use redundant or necessary. |
| L4-65 | fib | Among feasible complete job assignments, the lecture’s objective is to _____ the total cost. Use minimize or maximize. |
| L4-66 | fib | Skipping an unnecessary swap in selection sort also eliminates the scan that found the minimum. This statement is _____. Use true or false. |
| L4-67 | fib | In naive string matching, a mismatch rejects the current alignment, but does not necessarily prove the pattern is _____ from the whole text. |
| L4-68 | fib | Once one sorted run is exhausted, the other run can be copied without further head-to-head _____. |
| L4-69 | fib | In subset sum, changing only the order in which the same selected elements are written _____ create a new subset. Use does or does-not. |
| L4-70 | fib | Assigning the cheapest available job to each applicant in turn can affect the choices left for later applicants. It is therefore _____ to guarantee a globally minimum total merely from these local choices. Use valid or invalid. |
| L4-71 | fib | In the lecture’s selection sort, “no swaps were made” implies “no comparisons were made.” This implication is _____. Use true or false. |
| L4-72 | fib | An item swapped out of the next fixed position may still be moved in a later pass if it remains in the _____ suffix. |
| L4-73 | fib | In ordinary ascending insertion sort, a key already no smaller than the last element of the sorted prefix needs _____ shifts of that prefix. Use no or repeated. |
| L4-74 | fib | After partition places a pivot in its final position, recursive subarrays should _____ that pivot position. Use include or exclude. |
| L4-75 | mcq | Why is ordinary swap-based selection sort not guaranteed stable? |
| L4-76 | mcq | After one valid quicksort partition, what work may still be required? |
| L4-77 | mcq | An algorithm checks only adjacent entries in an arbitrarily ordered list of 2D points. Why is that insufficient for brute-force closest pair? |
| L4-78 | mcq | What makes exhaustive search able to certify the best feasible assignment? |
| L4-79 | match | Match each situation to a justified stopping action. |
| L4-80 | match | Match each input or implementation property to its effect. |

## Lecture 5: new Set 4

| ID | Format | New question |
| --- | --- | --- |
| L5-61 | fib | A greedy coin algorithm returns a valid coin combination but another combination uses fewer coins. Its result is feasible but not _____. |
| L5-62 | fib | In fractional knapsack, the remaining capacity cannot hold the whole next chosen item. Taking just part of that item is _____. Use allowed or forbidden. |
| L5-63 | fib | A price p[n] is the value of selling an uncut length-n rod. It is not necessarily the _____ revenue obtainable after choosing cuts. |
| L5-64 | fib | Enumerating cut-position patterns must include the pattern with no cuts, because selling the whole rod is a _____ candidate. Use valid or invalid. |
| L5-65 | fib | A feasible processor schedule reaches a proven lower bound on completion time. This establishes that the schedule is _____. |
| L5-66 | match | Match each knapsack observation to its consequence. |
| L5-67 | match | Match each rod-cutting table entry or operation to its meaning. |
| L5-68 | fib | The standard value-per-weight greedy proof for knapsack relies on item _____. Use divisibility or indivisibility. |
| L5-69 | fib | With fixed prices and no cutting fees, two recursive calls for the same remaining rod length describe the _____ optimization subproblem. Use same or different. |
| L5-70 | fib | A dynamic program has linearly many states. This alone is _____ to establish linear runtime without bounding the work per state. Use sufficient or insufficient. |
| L5-71 | fib | A rod-cutting algorithm must compare possible cuts with selling the rod _____. |
| L5-72 | match | Match each rod-cutting DP situation to the needed reasoning. |
| L5-73 | fib | A backtracking procedure stops as soon as it finds one n-Queens solution. It has thereby established the total number of solutions. This statement is _____. Use true or false. |
| L5-74 | fib | In a plain recursive rod-cutting tree, the same remaining-length label can occur in _____ nodes. Use multiple or only-one. |
| L5-75 | fib | For the lecture’s rod-cutting problem with fixed prices, the cache should be keyed by the remaining _____. |
| L5-76 | fib | Memoized rod revenues were computed with one price table. If prices change, reusing those revenues without recomputation may be _____. Use correct or incorrect. |
| L5-77 | match | Match each proposed rod-cutting shortcut to its flaw. |
| L5-78 | mcq | A memoized optimizer can legitimately return zero. Why is using zero to mean “not computed” potentially troublesome? |
| L5-79 | mcq | A partial search state looks unlikely to succeed but has not been shown impossible. What is the risk of pruning it when all solutions are required? |
| L5-80 | mcq | Compared with filling every entry of a bottom-up table, what can top-down memoization avoid? |
