#include <fstream>

using namespace std;

ifstream cin("adunare.in");
ofstream cout("adunare.out");

int main()
{
    int ct = 0;
    for(int i = 1; i <= 500000000; i++)
        ct++;

    cout << ct << '\n';

    return 0;
}
