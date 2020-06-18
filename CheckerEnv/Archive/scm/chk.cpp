#include <fstream>

using namespace std;

ifstream fin1("scm.out");
ifstream fin2("scm.ok");

int main()
{
    bool correct = true;

    int x, y; fin1 >> x; fin2 >> y;
    
    if(x != y)
        correct = false;
    if(fin1 >> x)
        correct = false;

    return !correct;
}